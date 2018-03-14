# promise作用
1.解决回调地域，使代码更加优雅易于维护,碰到下面这种后一项依赖前一项的功能的时候，嵌套回调能写到吐

```
let fs = require('fs'); 
fs.readFile('./1.txt','utf8',function(err,data){
    if(err) return console.log(err)
    fs.readFile(data,'utf8',function(err,data){
        if(err) return console.log(err);
        fs.readFile(data,'utf8',function(err,data){
            if(err) return console.log(err);
            fs.readFile(data,'utf8',function(err,data){
                if(err) return console.log(err);
                console.log(data);
            });
        });
    });
});
```
然后再感受下ES6的promise对象，是不是舒服太多，不用层层嵌套了，只需要通过then链式调用就行了

```
let promise = new Promise(function(resolve, reject) {
   resolve('测试啊啊啊');
  });
promise.then(function(data){
    console.log('data',data)
    return data
},function(err){
    console.log('err',err)
}).then(function(data){
    console.log('data1',data)
},function(err){
    console.log('err1',err)
})
//data 测试啊啊啊
//data1 测试啊啊啊
```
#### 我们在控制台打印new Promise(function(){})发现这个对象上有catch,finally,then这几个函数，接下来我们挨个实现
我们知道promise对象有两个参数，resolve和reject，他们都是函数,并且它的内部有三种状态分别是:pending（进行中）、fulfilled（已成功）和rejected（已失败),状态不可逆，改变一次就无法再次更改了。举个栗子
```
let promise = new Promise(function(resolve, reject) {
    resolve('测试成功');
    reject('测试失败')
   });
 promise.then(function(data){
     console.log('data',data)
 },function(err){
     console.log('err',err)
 })
 // data 测试成功
```
# 代码实现

```
function Promise(executor) {
   let self = this;
   self.status = 'pending'; //默认进行中态
   self.value = null; // 默认成功的值
   self.reason = null; // 默认失败的原因
   self.onResolvedCallbacks = []; // 存放then成功的回调函数,一个promise可能被多次调用,所以存到一个数组里
   self.onRejectedCallbacks = []; // 存放then失败的回调
   function resolve(value) {
        if (self.status === 'pending') {// 加上此判断防止状态被改变
            self.status = 'resolved';
            self.value = value;
            self.onResolvedCallbacks.forEach(function (fn) {
                fn();
            });
        }
   }
   function reject(reason) {
        if (self.status === 'pending') {
            self.status = 'rejected';
            self.reason = reason;
            self.onRejectedCallbacks.forEach(function (fn) {
                fn();
            })
        }
   }
   try {// 捕获异常，一旦出错，直接走reject
    executor(resolve, reject) 
   } catch (e) {
    reject(e)
   }
   
}
function resolvePromise(promise2, x, resolve, reject) {
  // 这里返回的x有可能是别人的promise
  // 所以这里尽可能的做容错处理
  if (promise2 === x) {
    return reject(new TypeError(' 循环引用了'))
  }
  let called;// 加个锁，防止重复调用
  if (x !== null && (typeof x === 'object' || typeof x === 'function') ){// x必须是一个对象
    try {
        let then = x.then //x对象上有then方法， 基本就能认为他是promise了
        if (typeof then === 'function'){
            then.call(x,function(y){
              called = true;
              resolvePromise(promise2, x, resolve, reject) // y可能还是一个promise,递归解析直到返回一个普通值
            },function(err){
               if (called) return;
               called = true;
               reject(err)
            })
        }
    } catch (e) {
        if(called) return; 
        called = true;
        reject(e)
    }
  } else {
   // 说明是一个普通值，变成成功态
   resolve(x);
  }
}
Promise.prototype.then = function(onFulfilled, onRjected){
 let  self = this;
 let promise2;  //返回的必须也是一个promise对象
 //  then的参数必须是function，或者直接做值得穿透，故做如下处理
 onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (value) {
    return value;
 };
 onRjected = typeof onRjected === 'function' ? onRjected : function (err) {
    throw err;
 };
 if(self.status === 'resolved'){
     // 成功态，我们调用成功回调onFulfilled
     // 有可能throw error, 所以加一个try/catch处理
    promise2 = new Promise(function(resolve, reject){
        setTimeout(function(){// 异步执行回调
            try {
                let x = onFulfilled(self.value) //可能是一个promise,也可能是一个普通的值
                resolvePromise(promise2, x, resolve, reject) // 由于x可能是一个promise，也可能是一个普通值，而且有可能是别人的promise
            } catch (error) {
                reject(error)
            }
        })
    })  
 }
 if(self.status === 'rejectd') {
     // 失败态，调用失败回调onRjected
    promise2 = new Promise(function(resolve, reject){
        setTimeout(function() {
            try {
                let x  = onRjected(self.reason);
                resolvePromise(promise2, x, resolve, reject)
            } catch (error) {
                reject(error)
            }
        })  
    })   
 }
 if(self.status === 'pending') {
     // 当前还处于pending态，所以不能确定调用哪个回调
   promise2 = new Promise(function(resolve, reject){
       self.onResolvedCallbacks.push(function(){
           setTimeout(function(){
               try {
                   let x = onFulfilled(self.value)
                   resolvePromise(promise2, x, resolve, reject);
               } catch (error) {
                   reject(error)
               }
           })
       });
       self.onRejectedCallbacks.push(function(){
           setTimeout(function(){
               try {
                   let x = onRjected(self.reason);
                   resolvePromise(promise2, x, resolve, reject);
               } catch (error) {
                   reject(error)
               }
           })
       })
   })
 }
 return promise2
}

Promise.prototype.catch = function(callback) {
  return this.then(null, callback)
}
// 挨个执行数组里面的函数,全部执行完之后走resolve返回给then
Promise.all = function(promises){
  return new Promise(function(resolve, reject){
    let arr = [];
    let i = 0;
    function handler(index, y){
       arr[index] = y;
       if(++i === promises.length) {
          resolve(arr);
       }
    }
    for(let i = 0;i < promises.length;i++){
      promises[i].then(function(y){
        handler(i, y)
      },reject)
    }
  })
}
// 只要有一个promise成功了就算成功了，如果第一个失败了就失败了
Promise.race = function(promises){
 return new Promise(function(resolve, reject){
   for(let i = 0;i < promises.length;i++){
        promises[i].then(resolve, reject);
   }
 })
}
// 直接生成一个成功promise
Promise.resolve = function(value) {
 return new Promise(function(resolve, reject){
   resolve(value)
 })
}

Promise.reject = function(reason){
 return new Promise(function(resolve, reject){
     reject(reason)
 })
}

module.exports = Promise;
```