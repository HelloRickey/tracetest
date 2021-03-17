const urlsalebase64=require("url-safe-base64");
const atob = require("atob");
// const issale = urlsalebase64.isUrlSafeBase64;
const base64 = urlsalebase64.decode(
  "8Eqs5ltdZmZzANzYM2-8cdSb4KLSWcBkbfhwYVuM9K8="
);
 var bin = atob(base64);


function bin2Hex(str) {
  var re = /[\u4E00-\u9FA5]/;
  var ar = [];
  for (var i = 0; i < str.length; i++) {
    var a = "";
    if (re.test(str.charAt(i))) {
      // 中文
      a = encodeURI(str.charAt(i)).replace(/%g/, "");
    } else {
      a = str.charCodeAt(i).toString(16);
    }
    ar.push(a);
  }
  str = ar.join("");
  return str;
}

const result = bin2Hex(bin);
console.log(result);