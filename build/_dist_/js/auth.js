var u=(n,r,e)=>new Promise((o,t)=>{var i=l=>{try{a(e.next(l))}catch(m){t(m)}},s=l=>{try{a(e.throw(l))}catch(m){t(m)}},a=l=>l.done?o(l.value):Promise.resolve(l.value).then(i,s);a((e=e.apply(n,r)).next())});const uuid=require("uuid");var bcrypt=require("bcrypt-nodejs");const dbName="brainsatplay";var SALT_FACTOR=5;module.exports.check=(n,r)=>u(this,null,function*(){let e=n.username,o=n.password,t,i,s={result:"incomplete",msg:"no message set"};if(r!=null){const a=r.db(dbName);o===""?e!==""&&e!="guest"?(yield a.collection("profiles").find({username:e}).count())==0?s={result:"OK",msg:e}:s={result:"incomplete",msg:"profile exists with this username. please choose a different ID."}:(e=uuid.v4(),s={result:"OK",msg:e}):e===void 0?s={result:"incomplete",msg:"username not defined"}:(t=yield a.collection("profiles").findOne({$or:[{username:e},{email:e}]}),t===null?(i="no profile exists with this username or email. please try again.",s={result:"incomplete",msg:i}):(s=yield compareAsync(o,t.password),s.result==="OK"&&(s.msg=e)))}else s={result:"OK",msg:e};return s});function compareAsync(n,r){return new Promise((e,o)=>{let t={result:"OK"};bcrypt.compare(n,r,function(i,s){i?(o(i),t={result:"incomplete",msg:i}):s||(msg="incorrect password. please try again.",t={result:"incomplete",msg}),e(t)})})}