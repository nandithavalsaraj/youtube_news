const express = require('express')

const CONFIG = require('./config')

const google = require('googleapis').google

const cookieParser = require('cookie-parser')

const jwt = require('jsonwebtoken')

const app = express()

app.set('view engine','ejs')

//__dirname is the const that specfies the current directory name
app.set('views',__dirname)

app.use(cookieParser())

const OAuth2 = google.auth.OAuth2

app.get('/',(req, res)=>{
  const oauth2client = new OAuth2(
    CONFIG.oauth2credentials.client_id,
    CONFIG.oauth2credentials.client_secret,
    CONFIG.oauth2credentials.redirect_uris[0]
  )
  const loginLink = oauth2client.generateAuthUrl({
    access_type: 'offline',
    scope: CONFIG.oauth2credentials.scopes
  })
  return res.render('index',{loginLink:loginLink})
})

app.get('/oauth2callback',function(req, res){
  const oauth2client = new OAuth2(
    CONFIG.oauth2credentials.client_id,
    CONFIG.oauth2credentials.client_secret,
    CONFIG.oauth2credentials.redirect_uris[0]
  )
  if(req.query.error){
    //user didnt grant permission
    return res.redirect('/')
  }
  else{
    oauth2client.getToken(req.query.code,function(err,token){
      if(err){return res.redirect('/')}
      res.cookie('jwt', jwt.sign(token,CONFIG.JWTsecret))
      return res.redirect('/subscription_list')
    })
  }
})

app.get('/subscription_list', function(req, res){
  if(!req.cookies.jwt){
    return res.redirect('/')
  }
  const oauth2client = new OAuth2(
    CONFIG.oauth2credentials.client_id,
    CONFIG.oauth2credentials.client_secret,
    CONFIG.oauth2credentials.redirect_uris[0]
  )
  oauth2client.credentials = jwt.verify(req.cookies.jwt,CONFIG.JWTsecret)

  // call youtube api
  const service = google.youtube("v3")
  //get user subscription list
  service.subscriptions.list({
    auth: oauth2client,
    mine :true,
    part: "snippet, contentDetails",
    maxResult:1
  })
  .then((response)=>{
     console.log(response)
     return res.render('subscriptions',{subscriptions: response.data.items})
  })
})

app.listen(5000,() =>{
  console.log("App is listening on port 5000")
})
