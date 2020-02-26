import PromiseLimit from './promiseLimit'

/**
 * @description 文件分片上传Util
 * @export
 * @class Concurrent
 */
export default class Concurrent {
    /**
     *Creates an instance of Concurrent.
     * @param {Function returns object Promise} upload
     * @param {Function returns object Promise} merge
     * @param {number} [size=1024 * 1024 * 1]
     * @param {number} [limit=4]
     * @memberof Concurrent
     */
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
        };
    }

    /**
     * @param {object} obj
     * @memberof Concurrent
     */
    setState(obj) {
        this.state = { ...this.state, ...obj };
    }

    /**
     * @description 文件分片
     * @returns {Array}
     * @memberof Concurrent
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
    * @memberof Concurrent
    */
    handleUpload = async (pathList) => {

        this.splitZip();

        let { fileSplit, file, limit } = this.state,
            { name: file_name } = file,
            fileMark = "";

        //文件过滤
        fileSplit = fileSplit.map((blob, index) => {
            fileMark += `${index}` //文件分片标识
            if ((Array.isArray(pathList) && !pathList.find(pp => pp.split("_file_mark_")[1] === `${index}`)) || !pathList) {
                return { file: blob, file_mark: `${fileMark}_index_${index}`, file_name }
            } else {
                return null
            }
        })
        fileSplit = fileSplit.filter(item => item);

        // 没有缺失的片段 ，发送合并请求
        if (Array.isArray(fileSplit) && fileSplit.length === 0) {
            return this.state.merge.call(this, { file_name })
        }

        //2.上传缺失的文件块,PROMISE 限流
        const promiseLimit = new PromiseLimit(this.limit, fileSplit, this.state.upload)
        await promiseLimit.excute();

        return this.state.merge.call(this, { file_name })
    }

    /**
     * @description 分片上传
     * @param {Array} fileSequenceItem
     * @param {String} file_name
     * @memberof Concurrent
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