// @APIVersion 1.0.0
// @Title beego Test API
// @Description beego has a very cool tools to autogenerate documents for your API
// @Contact astaxie@gmail.com
// @TermsOfServiceUrl http://beego.me/
// @License Apache 2.0
// @LicenseUrl http://www.apache.org/licenses/LICENSE-2.0.html
package routers

import (
	"file-split/controllers"
	"github.com/astaxie/beego"
	"github.com/astaxie/beego/plugins/cors"
)

var (
	fileCtrl = &controllers.FileController{}
)

func init() {
	beego.InsertFilter("*", beego.BeforeRouter, cors.Allow(&cors.Options{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"POST", "GET", "PUT", "DELETE", "PATCH"},
		AllowHeaders:     []string{"Origin", "Authorization", "Access-Control-Allow-Origin", "Content-Typ", "Cache-Control", "access_token"},
		ExposeHeaders:    []string{"Content-Length", "Access-Control-Allow-Origin"},
		AllowCredentials: true,
	}))
	ns := beego.NewNamespace("/v1")
	{
		resNS := beego.NewNamespace("/resources")
		{
			resNS.Post("/upload", fileCtrl.Upload)
			resNS.Post("/blobs", fileCtrl.GetBlobs)
			resNS.Post("/merge", fileCtrl.MergeFiles)
		}
		ns.Namespace(resNS)
	}
	beego.AddNamespace(ns)
}
