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