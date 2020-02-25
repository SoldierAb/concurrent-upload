package controllers

import (
	"fmt"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
)


type FileController struct {
	beego.Controller
}


type CommonResult struct {
	Code int `json:"code"`
	Data interface{} `json:"data"`
	MSG string `json:"msg"`
}

type FileList []string

func (f FileList) Len() int{
	return len(f)
}

func (f FileList) Swap(i,j int){
	f[i],f[j] = f[j],f[i]
}

func (f FileList) Less(i,j int) bool{
	return len(f[i])<len(f[j])
}

type CallBack func(dirname string, list *FileList) error

func ReadDir(dirname string, list *FileList, callback CallBack) error {
	rd, err := ioutil.ReadDir(dirname)
	if err != nil {
		return err
	}
	for _, fi := range rd {
		fullDir := filepath.Join(dirname, fi.Name())
		if fi.IsDir() {
			err := ReadDir(fullDir, list, callback)
			if err != nil {
				return err
			}
		} else {
			*list = append(*list, fullDir)
		}
	}
	return nil
}

func (f *FileController) GetBlobs(ctx *context.Context){
	fileFullName := ctx.Request.Form.Get("file_name")
	fileName, _ := GetFileName(fileFullName)

	blobDir := filepath.Join("./static/blobs/", fileName)

	pathList := FileList{}

	err := ReadDir(blobDir, &pathList, nil)

	if err !=nil{
		OutJson(ctx,http.StatusInternalServerError,err,"read dir fail")
		return
	}

	OutJson(ctx,http.StatusOK, struct {
		Dir string `json:"dir"`
		List FileList `json:"list"`
	}{
		Dir:blobDir,
		List:pathList,
	},"success")
}

func (f *FileController) MergeFiles(ctx *context.Context) {
	fileFullName := ctx.Request.Form.Get("file_name")
	fileName, fileExt := GetFileName(fileFullName)

	blobDir := filepath.Join("./static/blobs/", fileName)
	mergeFilePath := filepath.Join("./static/store/", fmt.Sprintf("%s%s", fileName, fileExt))

	pathList := FileList{}

	err := ReadDir(blobDir, &pathList, nil)

	if err != nil {
		OutJson(ctx,http.StatusOK,nil,"dir is not exist")
	}

	err = os.MkdirAll(filepath.Dir(mergeFilePath), os.ModePerm) //创建目录

	if err !=nil{
		OutJson(ctx,http.StatusInternalServerError,err,"create merge dir fail")
		return
	}

	dest, err := os.Create(mergeFilePath) //创建文件
	defer dest.Close()

	if err != nil {
		OutJson(ctx,http.StatusInternalServerError,err,"create merge file fail")
		return
	}

	sort.Stable(pathList)

	for _, v := range pathList {
		fd, _ := os.Open(v)
		defer fd.Close()

		_, err = io.Copy(dest, fd) //文件数据拷贝写入
		if err != nil {
			OutJson(ctx,http.StatusInternalServerError,err,"merge fail")
			return
		}
	}
}

func (f *FileController) Upload(ctx *context.Context) {
	err := ctx.Request.ParseForm()

	if err != nil {
		OutJson(ctx,http.StatusInternalServerError,err,"request param parse error")
		return
	}

	fileFullName := ctx.Request.Form.Get("file_name")
	fileIndex := ctx.Request.Form.Get("index")
	fileName, _ := GetFileName(fileFullName)
	fName := fmt.Sprintf("%s/%s", fileName, fileIndex)
	fPath := filepath.Join("./static/blobs", fName)

	err = f.SaveFile(ctx, "file", fPath)


	if err != nil {
		OutJson(ctx,http.StatusInternalServerError,err,"upload fail")
	} else {
		OutJson(ctx,http.StatusOK,err,"success")
	}
}

func (f *FileController) SaveFile(ctx *context.Context, key, fPath string) error {
	fd, _, err := ctx.Request.FormFile(key) //获取第一个文件
	defer fd.Close()
	if err != nil {
		if err == http.ErrMissingFile {
			return err
		} else {
			return err
		}
	}

	err = os.MkdirAll(filepath.Dir(fPath), os.ModePerm) //创建上传目录

	if err != nil {

	}

	dest, err := os.Create(fPath) //创建上传文件
	defer dest.Close()

	if err != nil {
		return err
	}

	_, err = io.Copy(dest, fd) //文件数据拷贝写入

	if err != nil {
		return err
	}
	return nil
}

func GetFileName(fPath string) (fName, fExt string) {
	fExt = path.Ext(path.Base(fPath))
	fName = strings.TrimSuffix(fPath, fExt)
	return
}

// json响应数据渲染接口
func  OutJson(ctx *context.Context,code int, data interface{},msg string) {
	ctx.Output.SetStatus(http.StatusOK)
	_ = ctx.Output.JSON(&CommonResult{
		Code: code,
		Data: data,
		MSG:  msg,
	}, false, false)
}



