//console.log(module);
/*const os = require('http');
const fs = require('fs');
const _ = require('lodash');

const server=os.createServer((req,res)=>{
    //loadash
    const num=_.random(0,20);
    console.log(num);

    const greet=_.once(()=>{
        console.log('hello');
    });
    greet();
    greet();
    res.setHeader('Context-Type','text/html')
    let path='./views/';
    switch(req.url){
        case '/':
            path+='blog.html';
            res.statusCode=200;
            break;
        case '/about':
            path+='about.html';
            res.statusCode=200;
            break;
        case '/about-me':
            res.statusCode=301;
            res.setHeader('Location','/about');
            res.end();
            break;
        default:
            path+='404.html';
            res.statusCode=404;
            break;
    }

    fs.readFile(path,(err,data)=>{
        if(err){
            console.log(err);
            res.end;
        }else{
            res.statusCode=200;
            res.end(data);
        }
    })
});

server.listen(3000,'localhost',()=>{
    console.log('listening to the port 3000')
});*/

















