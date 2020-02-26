

export default class Concurrent {
    constructor(
        upload,
        merge,
        size = 1024 * 1024 * 1,  //默认 1M
        limit = 4, //并发限制 默认 4
    ) {
        this.state = {
            upload,
            merge,
            size,
            limit,
            file: null,    //当前文件对象
            fileSplit: [],   // 文件分片
        }
    }

    /** 
     * @description state 更新
    */
    setState(obj) {
        this.state = { ...this.state, ...obj };
    }

    /** 
     * @description 文件分片
     * @param {number} 默认 1M
     * @returns {blob array}
    */
    splitZip() {
        const { file, size } = this.state;
        const fileSplit = [];

        if (file.size > size) {
            let start_index = 0, end_index = 0;
            while (true) {
                end_index += size;
                const blob = file.slice(start_index, end_index);
                start_index += size;
                if (!blob.size) break;
                fileSplit.push(blob);
            }
        } else {
            fileSplit.push(file);
        }
        this.setState({
            fileSplit
        });
        return fileSplit;
    }

    /** 
    * @description 上传行为；如果 pathList 为  falsy或[] 则上传当前所有分片
   */
    handleUpload = async (pathList) => {

        this.splitZip();

        let { fileSplit, file, limit } = this.state,
            { name: file_name } = file,
            fileSequenceItem = [],
            fileSequence = [],
            fileMark = "";

        //文件过滤
        fileSplit = fileSplit.map((blob, index) => {
            fileMark += `${index}` //文件分片标识
            if ((Array.isArray(pathList) && !pathList.find(pp => pp.split("_index_")[1] === `${index}`)) ||!pathList ) {
                return { file: blob, index: `${fileMark}_index_${index}` }
            } else {
                return null
            }
        })
        fileSplit = fileSplit.filter(item => item);

        // 没有缺失的片段 ，发送合并请求
        if (Array.isArray(fileSplit) && fileSplit.length === 0) {
            return this.state.merge.call(this, { file_name })
        }

        //2.上传缺失的文件块
        let fileSequenceLen = fileSplit.length;

        fileSplit.forEach(file => {
            fileSequenceItem.push(file);
            fileSequenceLen -= 1;
            if (fileSequenceItem.length === limit) {
                fileSequence.push(fileSequenceItem);
                fileSequenceItem = [];
            }
            if (fileSequenceLen === 0 && fileSequenceItem.length) {
                fileSequence.push(fileSequenceItem);
            }
        })

        await this.fileSequenceUpload(fileSequence, file_name)
        return this.state.merge.call(this, { file_name })
    }

    /** 
     * @description 文件分片队列上传
    */
    fileSequenceUpload = async (fileSequence, file_name) => {
        let sequenceLen=fileSequence.length;
        while (sequenceLen) {
            const fileSequenceItem = fileSequence.shift();
            await this.sequenceUpload(fileSequenceItem, file_name)
            // await new Promise((resolve)=>{
            //     setTimeout(() => {
            //         this.sequenceUpload(fileSequenceItem, file_name)
            //         resolve();
            //     }, 2000);
            // })
            sequenceLen-=1;
        }
        return true
    }


    /** 
     * @description 分片上传
    */
    sequenceUpload = (fileSequenceItem, file_name) => {
        return Promise.all(
            fileSequenceItem.map(item =>
                this.state.upload.call(this, {
                    file: item.file,
                    file_mark: item.index,
                    file_name,
                })
            )
        )
    }


}