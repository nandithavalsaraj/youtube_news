//alert("hello");
chrome.runtime.onMessage.addListener(function (request){
	alert(request)
})