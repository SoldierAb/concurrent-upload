export default class PromiseLimit {
    constructor(limit = 4, params,iteratorFunc) {
        this.limit = limit;
        this.params = params;
        this.i = 0;
        this.iteratorFunc= iteratorFunc;
        this.sequenceRet = [];
        this.sequenceExcuting = [];
    }

    sequence = async () => {
        //遍历结束
        if (this.i === this.params.length) {
            return Promise.resolve();
        }

        const paramItem = this.params[this.i++];

        const p = Promise.resolve().then(() => this.iteratorFunc(paramItem));

        this.sequenceRet.push(p);

        // 如果执行完毕，从执行队列中删除
        const e = p.then(() => this.sequenceExcuting.splice(this.sequenceExcuting.indexOf(e), 1));

        this.sequenceExcuting.push(e);

        let r = Promise.resolve();
        // 执行队列>= 限制并发数时进行触发，结束后递归假如新的Promise实例
        if (this.sequenceExcuting.length >= this.limit) {
            r = Promise.race(this.sequenceExcuting);
        }

        await r;
        return this.sequence();
    }

    excute = async () => {
        await this.sequence();
        return await Promise.all(this.sequenceRet);
    }
}
