const express =require("express");
const { json } = require("express/lib/response");
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const app = express();

const fs = require("fs");
const { send } = require("process");

app.use(express.json());
app.use(express.urlencoded({extended:true}));

//app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res)=>{res.sendFile(__dirname + "/public/index.html");});
app.get("/login", (req, res)=>{res.sendFile(__dirname + "/public/login.html");});
app.get("/signup", (req, res)=>{res.sendFile(__dirname + "/public/signup.html");});
app.get("/product/:id", (req, res)=>{res.sendFile(__dirname + "/public/product.html");});

app.get("/product/info/:id", async function(req, res){
    isIdNumber=isNaN(req.params.id);
    if(req.params.id=='..undefined'||req.params.id==null||req.params.id==undefined){return res.status(400).send('파람 값이 잘못 왔어요');};
    const db = await getDBConnection();
    const page= await db.all(`select * from products where product_id = ${req.params.id}`);
    await db.close();
    res.status(200).send(page);
});


async function getDBConnection(){
    const db = await sqlite.open({
        filename:'product.db',
        driver:sqlite3.Database
    });
    return db;
};

app.get("/db", async function(req, res){
    const db = await getDBConnection();
    const rows= await db.all('select * from products');
    await db.close();
    console.log(rows);
    res.status(200).send("오긴왔네용");
});

function categoryFilter(json, category) {
    if(category==null||category==undefined||category==""||category=="all"){
        return json;
    }else{
        return json.filter(product=>product["product_category"]==category);
    }
}
function keywordFilter(json, keyword) {
    if(keyword==null||keyword==undefined||keyword==""){
        return json;
    }else{
        return json.filter(product=>product["product_title"].includes(keyword));
    }
}
function pageFilter(json, page) {
    if(page==0){
        return json.slice(0, 8);
    }else{
        return json.slice(4+page*4, 8+page*4);
    }
}

async function filter(json, category, keyword, page){
    const categoryJson=await categoryFilter(json, category);
    const keywordJson=await keywordFilter(categoryJson, keyword);
    const result=await pageFilter(keywordJson, page);
    return result;
}


app.get("/search", async function(req,res){
    if(!req.query.page){
        res.status(400).send("페이지 값을 넣어주세요");
        return;
    }
    const db = await getDBConnection();
    const products= await db.all('select * from products');
    await db.close();
    filter(products, req.query.category, req.query.keyword, req.query.page)
    .then(response => {
            res.status(200).send(response);}
    )
    .catch(error => {
            console.log(error);
            res.status(500).send("필터링하다가 안됐어요");
    })
})

app.get("/product/comment/:id", function(req,res){
    console.log('왜 안들어오지');

    fs.readFile("comment.json", 'utf8', async function(error, comment){
        if(error){
            res.status(500).send("500 서버 에러! comment.json 읽다가 문제 생김");
        }else{
            const commentJson=JSON.parse(comment);
            const result=commentJson.filter(comments=>comments["book_id"]==req.params.id);
            const reverseResult = [...result].reverse();
            console.log(reverseResult);
            res.status(200).send(reverseResult);
        }
    })
})


app.post("/product/write", function(req,res){
    console.log('작성요청');
    console.log(req.body);
    fs.readFile("comment.json", 'utf8', async function(error, comment){
        if(error){
            res.status(500).send("500 서버 에러! comment.json 읽다가 문제 생김");
        }else{
            const commentJson=JSON.parse(comment);
            commentJson.push(req.body);
            //console.log(commentJson);
            const comments=JSON.stringify(commentJson);
            //comments=comments+"";
            fs.writeFile('comment.json',comments, function(err){
                if (err === null) {
                    res.status(200).send("후기가 작성되었습니다");
                } else {
                    res.status(200).send("후기가 작성에 문제가 생겼습니다");
                }
            });
        }
    })

})

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`sever on! http://localhost:${PORT}`);
});