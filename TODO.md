- Promise的用法不太对，每个返回Promise的函数不必非得用Promise包装一层，只要返回的是一个Promise就行了
```
func () {
    return Promise((resolve, reject) => {
        ...
        return resolve(rst);
    });
}
////////////
func2 () {
    return Ctrl.PromiseFunc()
        .then(rst => {
            ...
            return Promise.resolve(rst);
        })
        .catch(Promise.reject);
}
```
