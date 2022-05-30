const express =require("express");
const { json } = require("express/lib/response");

const app = express();

const fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(express.static("public"));

app.get("/", (req, res)=>{res.sendFile(__dirname + "/index.html");});


function categoryFilter(json, category) {
    if(category==null||category==undefined||category==""){
        console.log('카테고리 값이 안옴');
        return json;
    }else{
        return json.filter(product=>product["category"]==category);
    }
}
function keywordFilter(json, keyword) {
    if(keyword==null||keyword==undefined||keyword==""){
        console.log('키워드 값이 안옴');
        return json;
    }else{
        return json.filter(product=>product["title"].includes(keyword));
    }
}
function pageFilter(json, page) {
    if(page==0){
        return json.slice(0, 6);
    }else{
        return json.slice(4+page*2, 6+page*2);
    }
}

async function filter(json, category, keyword, page){
    const categoryJson=await categoryFilter(json, category);
    const keywordJson=await keywordFilter(categoryJson, keyword);
    const result=await pageFilter(keywordJson, page);
    return result;
}


app.get("/search", function(req,res){
    if(!req.query.category&&!req.query.keyword){
        res.status(400).send("쿼리값이 맞지 않습니다. 잘못된 요청입니다");
        return;
    }
    if(!req.query.page){
        res.status(400).send("페이지 값을 넣어주세요");
        return;
    }
    console.log(req.query);

    fs.readFile("product.json", 'utf8', function(error, product){
        if(error){
            res.status(500).send("500 서버 에러! product.json 읽다가 문제 생김");
        }else{
            const productJson=JSON.parse(product);
            filter(productJson, req.query.category, req.query.keyword, req.query.page)
            .then(response => {
                console.log(response);
                res.status(200).send(response);}
            )
            .catch(error => {
                console.log(error);
                res.status(500).send("필터링하다가 안됐어요");
            })
            
        }
    })
})

const PORT = process.env.PORT || 8000;

app.listen(PORT, ()=>{
    console.log("서버가 실행됐습니다.");
    console.log(`서버주소: http://localhost:${PORT}`);

});