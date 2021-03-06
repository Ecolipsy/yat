#!/usr/bin/env node
const udp = require("dgram");
const tcp = require("net");
const Yargs = require("yargs");
const {hideBin} = require("yargs/helpers");

var yargs = Yargs(hideBin(process.argv))
yargs.option("protocol", {description: "Protocol to use. (TCP or UDP(4|6) )", alias: "p"});
yargs.option("sourcehost", {description: "The source of the tunnel. (Server host)", alias: "shost"});
yargs.option("destinationhost", {description: "The destination of the tunnel. (Listening host)", alias: "dhost"});
yargs.option("sourceport", {description: "The source of the tunnel. (Server port)", alias: "sport"});
yargs.option("destinationport", {description: "The destination of the tunnel. (Listening port)", alias: "dport"});
yargs.option("destinationprotocol", {description: "The protocol of the destination. (Listening protocol)", alias: "dprot"});
yargs.argv;
//console.log(yargs.argv);
if(!yargs.argv["protocol"]){
    console.log("Missing required option: '--protocol'");
    console.log("For help, execute 'yat --help'");
    process.exit();
}
if(!yargs.argv["sourcehost"]){
    console.log("Missing required option: '--sourcehost'");
    console.log("For help, execute 'yat --help'");
    process.exit();
}
if(!yargs.argv["destinationhost"]){
    console.log("Missing required option: '--destinationhost'");
    console.log("For help, execute 'yat --help'");
    process.exit();
}
if(!yargs.argv["sourceport"]){
    console.log("Missing required option: '--sourceport'");
    console.log("For help, execute 'yat --help'");
    process.exit();
}
if(!yargs.argv["destinationport"]){
    console.log("Missing required option: '--destinationport'");
    console.log("For help, execute 'yat --help'");
    process.exit();
}
if(isNaN(yargs.argv["sourceport"])){
    console.log("Source port needs to be a number between 0 and 65535.");
    console.log("For help, execute 'yat --help'");
    process.exit();
}
if(isNaN(yargs.argv["destinationport"])){
    console.log("Destination port needs to be a number between 0 and 65535.");
    console.log("For help, execute 'yat --help'");
    process.exit();
}
var dprot = yargs.argv["destinationprotocol"] || yargs.argv["protocol"];

var shost = yargs.argv["sourcehost"];
var sport = yargs.argv["sourceport"];
var dhost = yargs.argv["destinationhost"];
var dport = yargs.argv["destinationport"];

switch(dprot.toLowerCase()){
    case "tcp":
        const server = tcp.createServer();
        
        server.on("connection", (client) => {
            console.log("Connection from", client.remoteAddress + ":" + client.remotePort);
            if(yargs.argv["protocol"] == "tcp"){
                client._client = tcp.createConnection({host: shost, port: sport});
                client.on("data", (d) => {
                    client._client.write(d);
                });
                client._client.on("data", (d) => {
                    client.write(d);
                });
            } else{
                client.on("data", (d) => {
                    var udpclient = udp.createSocket(yargs.argv["protocol"], (clb, rinfo) => {
                        client.write(clb);
                    });
                    udpclient.send(d, sport, shost);
                });
            }
        });

        server.on("listening", () => {
            console.log("(TCP) Listening to", dhost + ":" + dport);
        });

        server.listen(dport, dhost);
        break;
    case "udp4":
        const sock = udp.createSocket("udp4", (d, ri) => {
            console.log("Connection from", ri.address + ":" + ri.port);
            if(yargs.argv["protocol"].toLowerCase().startsWith("udp")){
                var rSock = udp.createSocket(yargs.argv["protocol"], (rD, rRi) => {
                    sock.send(rD, ri.port, ri.address);
                });
                rSock.send(d, sport, shost);
            } else{
                var cli = tcp.createConnection({host: shost, port: sport});
                var ssock = udp.createSocket("udp4", (clb, sri) => {
                    cli.write(clb);
                });
                cli.on("data", (d) => {
                    ssock.send(d, ri.port, ri.address);
                });
            }
        });
        sock.bind(dport, dhost);
        sock.on("listening", () => {
            console.log("(UDP) Listening to", dhost + ":" + dport);
        });
        break;
    case "udp6":
        const sock6 = udp.createSocket("udp6", (d, ri) => {
            console.log("Connection from", ri.address + ":" + ri.port);
            if(yargs.argv["protocol"].toLowerCase().startsWith("udp")){
                var rSock = udp.createSocket(yargs.argv["protocol"], (rD, rRi) => {
                    sock6.send(rD, ri.port, ri.address);
                });
                rSock.send(d, sport, shost);
            } else{
                var cli = tcp.createConnection({host: shost, port: sport});
                var ssock = udp.createSocket("udp6", (clb, sri) => {
                    cli.write(clb);
                });
                cli.on("data", (d) => {
                    ssock.send(d, ri.port, ri.address);
                });
            }
        });
        sock6.bind(dport, dhost);
        sock6.on("listening", () => {
            console.log("(UDP) Listening to", dhost + ":" + dport);
        });
        break;

    default:
        console.log(`Unknown protocol '${yargs.argv.protocol}'`);
        console.log("For help, execute 'yat --help'");
        break;
}