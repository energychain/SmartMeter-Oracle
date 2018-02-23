const http = require("https");
var ethers = require('ethers');


module.exports =function() {
	var bcmeter = {};

	bcmeter.getMeterReading=function(containerId,tokenId) {
		var p1 = new Promise(function(resolve, reject) { 
			var ts = new Date().getTime()-5000;
			var str="";
			http.get("https://my.discovergy.com/json/WidgetJSON.getLast?containerId="+containerId+"&tokenId="+tokenId+"&widgetType=FLOW_GRAPHIC_WIDGET&wait=5000&since="+ts+"&_="+ts, function(res) {
						res.on('data',function(chunk){
							str+=chunk;
						});
						res.on('end',function(){					 						
							var obj = JSON.parse(str);               
							if(obj.status=="error") reject("Invalid Token"); else {     					   					   					    
								var reading=Math.round(obj.result[0].values[0].value/10000000);
								resolve(reading);						
							}
						});                
			})	
		});
		return p1;
	}

	bcmeter.commitReading=function(wallet,reading) {	
		var p1 = new Promise(function(resolve, reject) { 
			contract = new ethers.Contract("0x0000000000000000000000000000000000000008", [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"readings","outputs":[{"name":"time","type":"uint256"},{"name":"power","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"mpo","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_reading","type":"uint256"}],"name":"storeReading","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_mpo","type":"address"}],"name":"setMPO","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_meter_point","type":"address"},{"indexed":false,"name":"_power","type":"uint256"}],"name":"Reading","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"old_owner","type":"address"},{"indexed":false,"name":"new_owner","type":"address"}],"name":"Transfered","type":"event"}], wallet);	
			contract.storeReading(Math.round(reading)).then(function(tx) {
					resolve(tx);
			}).catch(function(e) { console.log("Error",e); });
		});
		return p1;
	}	

	bcmeter.commitIf=function(wallet,reading) {	
		var p1 = new Promise(function(resolve, reject) { 
			contract = new ethers.Contract("0x0000000000000000000000000000000000000008", [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"readings","outputs":[{"name":"time","type":"uint256"},{"name":"power","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"mpo","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_reading","type":"uint256"}],"name":"storeReading","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_mpo","type":"address"}],"name":"setMPO","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_meter_point","type":"address"},{"indexed":false,"name":"_power","type":"uint256"}],"name":"Reading","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"old_owner","type":"address"},{"indexed":false,"name":"new_owner","type":"address"}],"name":"Transfered","type":"event"}], wallet);	
			contract.readings(wallet.address).then(function(t) {
				if((reading-t.power.toString()*1>100)||((new Date().getTime()/1000)-t.time>7200)) {
					bcmeter.commitReading(wallet,reading).then(function(o) {
							resolve(o);
					});
				} else {
					resolve("Not commited - last update to recent.");
				}
			});
		});
		return p1;
	}	

	bcmeter.commit=function(containerId,tokenId,deploymentId) {
		var p1 = new Promise(function(resolve, reject) { 
			require('dotenv').config();
			var rpcurl="https://fury.network/rpc";
			if(tokenId==null) {
				if(typeof process.env.tokenId!="undefined")  {
						tokenId= process.env.tokenId;
				}
			}
			if(containerId==null) {				
				if(typeof process.env.containerId!="undefined")  {
						containerId= process.env.containerId;
				}
			}
			if(deploymentId==null) {
				if(typeof process.env.deploymentId!="undefined")  {
						deploymentId= process.env.deploymentId;
				}
			}			
			if(typeof process.env.rpcurl!="undefined") {
					rpcurl=process.env.rpcurl;
			}
			new ethers.Wallet.fromBrainWallet(containerId, tokenId+"_"+deploymentId).then(function(wallet) {
				wallet.provider=new ethers.providers.JsonRpcProvider(rpcurl,"ropsten")
				bcmeter.getMeterReading(containerId,tokenId).then(function(reading) {
						bcmeter.commitIf(wallet,reading).then(function(o) {
								resolve({status:"ok",error:null,address:wallet.address,tx:o});
						}).catch(function(e) {reject({status:"error",error:e,address:wallet.address})});			
				}).catch(function(e) {	
					reject({status:"error",error:e,address:wallet.address})		
				});	
			});
		});
		return p1;
	}
	this.commit=bcmeter.commit;	
}

