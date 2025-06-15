const { Server } = require("@grpc/grpc-js");
const { grpcErrorHandler } = require("./middlewares/grpcErrorHandlerMiddleware");
const loadProto = require("./utils/loadProto");
const videoService = require("./services/videoService");

const server = new Server();
const proto = loadProto("videos");
server.addService(proto.Videos.service, videoService);

// Inicializa manejo global de errores y consumidores de RabbitMQ
grpcErrorHandler(server);

module.exports = server;