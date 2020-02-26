import React from 'react';
import { uploadFetch } from './utils/upload';
import ConcurrentUtil from './utils/concurrent'
import "./file.css";

export default class FileContainer extends React.Component {
    constructor() {
        super();
        this.concurrent = new ConcurrentUtil(this.uploadRequest,this.mergeRequest);
        this.state = {
            file: null,
            fileSplit: [],
        };
    }

    onChange = (event) => {
        event.persist();
        const [file] = event.target.files;
        this.setState({
            file
        });
        this.concurrent.setState({
            file
        });
        event.preventDefault();
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        const startTime = new Date().getTime(),
            { name: file_name } = this.state.file;
        console.log("start at: -----> ", startTime);
        //1.请求服务端，查找对应文件块
        const { data: { list: pathList } } = await uploadFetch({
            action: '/v1/resources/blobs',
            data: {
                file_name
            }
        })
        this.concurrent.handleUpload(pathList).then((res) => {
            const endTime = new Date().getTime();
            console.log("<------ end at: -----> ", endTime, "   duration:   ", endTime - startTime);
            alert('= = ',res);
        });
    }

    /** 
     * @description 文件上传
    */
    uploadRequest=({file,file_name,file_mark:index})=>{
       return uploadFetch({
            action: '/v1/resources/upload',
            file,
            data: {
                file_name,
                index,
            }
        })
    }

    /** 
     * @description 合并请求
    */
    mergeRequest=({file_name})=>{
        return uploadFetch({
            action: '/v1/resources/merge',
            data: {
                file_name
            },
        })
    }

    // /** 
    //  * @description 上传任务
    // */
    // handleUpload = (limitCount = 4) => new Promise(async (resolve) => {
    //     let { fileSplit, file } = this.state,
    //         { name: file_name } = file,
    //         fileSequenceItem = [],
    //         fileSequence = [],
    //         fileMark = "";

    //     //1.请求服务端，查找对应文件块是否存在
    //     const { data: { list: pathList } } = await uploadFetch({
    //         action: '/v1/resources/blobs',
    //         data: {
    //             file_name
    //         }
    //     })
    //     //文件过滤
    //     fileSplit = fileSplit.map((blob, index) => {
    //         fileMark += `${index}` //文件分片标识
    //         if ((Array.isArray(pathList)&&pathList.length&&!pathList.find(pp => pp.split("_index_")[1] === `${index}`)) || !pathList) {
    //             return { file: blob, index: `${fileMark}_index_${index}` }
    //         } else {
    //             return null
    //         }
    //     })
    //     fileSplit = fileSplit.filter(item => item);

    //     //2.上传缺失的文件块
    //     if (Array.isArray(fileSplit)&&fileSplit.length===0){
    //         return uploadFetch({
    //             action: '/v1/resources/merge',
    //             data: {
    //                 file_name
    //             },
    //         }).then(() => {
    //             resolve("success");
    //         })
    //     }

    //     let fileSequenceLen = fileSplit.length;

    //     fileSplit.forEach(file => {
    //         fileSequenceItem.push(file);
    //         fileSequenceLen -= 1;
    //         if (fileSequenceItem.length === limitCount) {
    //             fileSequence.push(fileSequenceItem);
    //             fileSequenceItem = [];
    //         }
    //         if (fileSequenceLen === 0 && fileSequenceItem.length) {
    //             fileSequence.push(fileSequenceItem);
    //         }
    //     })

    //     //分片队列上传操作
    //     fileSequence.forEach(async (fileArray, index) => {
    //         await this.sequenceUpload(fileArray, file_name);
    //         if (index === fileSequence.length - 1) {
    //             //结束传输，发送合并请求
    //             uploadFetch({
    //                 action: '/v1/resources/merge',
    //                 data: {
    //                     file_name
    //                 },
    //             }).then(() => {
    //                 resolve("success");
    //             })
    //         }
    //     })

    // })

    // /** 
    //  * @description 分片队列上传
    // */
    // sequenceUpload = (fileSequenceItem, file_name) => {
    //     return Promise.all([
    //         ...fileSequenceItem.map(item => {
    //             return uploadFetch({
    //                 action: '/v1/resources/upload',
    //                 file: item.file,
    //                 data: {
    //                     file_name,
    //                     index: item.index,
    //                 }
    //             })
    //         })
    //     ])
    // }

    // /** 
    //  * @description 文件分片
    //  * @param {number} 默认 1M
    //  * @returns {blob array}
    // */
    // splitZip(file, size = 1024 * 1024 * 1) {
    //     let fileSplit = [];

    //     if (file.size > size) {
    //         let start_index = 0, end_index = 0;
    //         while (true) {
    //             end_index += size;
    //             const blob = file.slice(start_index, end_index);
    //             start_index += size;
    //             if (!blob.size) break;
    //             fileSplit.push(blob);
    //         }
    //     } else {
    //         fileSplit.push(file);
    //     }
    //     this.setState({
    //         fileSplit
    //     });
    //     return fileSplit;
    // }

    render() {
        return (
            <div className="file-container">
                <form onSubmit={this.handleSubmit}>
                    <label>请上传文件: </label>
                    <input type="file" name="file" id="file" onChange={this.onChange} />
                    <input type="submit" value="提交" />
                </form>
                <hr />
                <div>
                    {this.state.file ? this.state.file.name : ''}
                </div>
                <ul>
                    {
                        this.state.fileSplit.map((item, index) =>
                            <li key={index}>{index}</li>
                        )
                    }
                </ul>
            </div>
        )
    }
}