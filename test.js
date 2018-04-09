console.log('global')

for (var i = 1;i <= 5;i ++) {
  setTimeout(function() {
    console.log(i)
  },i*1000)
  console.log(i)
}

new Promise(function (resolve) {
  console.log('promise1')
  resolve()
 }).then(function () {
  console.log('then1')
})

setTimeout(function () {
  console.log('timeout2')
  new Promise(function (resolve) {
    console.log('timeout2_promise')
    resolve()
  }).then(function () {
    console.log('timeout2_then')
  })
}, 1000)


// setTimeout(function () {
//     console.log(1)
// }, 0);
// new Promise(function executor(resolve) {
//     console.log(2);
//     for (var i = 0; i < 10000; i++) {
//         i == 9999 && resolve();
//     }
//     console.log(3);
// })
//     .then(function () {
//         console.log(4);
//     });
// console.log(5);

// console.log('1')
// let doSth = new Promise((resolve, reject) => {
//     console.log('2');
//     resolve();
//     console.log('4')
//     setTimeout(() => {
//         console.log('8')
//     }, 0)
//     setTimeout(()=>{
//      console.log('11')
//     },0)
// });
// let doSth1 = new Promise((resolve, reject) => {
//     console.log('6');
//     resolve();
//     setTimeout(() => {
//         console.log('9')
//     }, 0)
// });

// setTimeout(() => {
//     console.log('10')
//     doSth.then(() => {
//         console.log('3');
//     })
// }, 0);
// setTimeout(() => {
//     console.log('5')
//     doSth1.then(() => {
//         console.log('7');
//     })
// }, 0);
//124638957   12468 11 9 10 357