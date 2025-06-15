const {catchGrpc} = require('../utils/catchGrpc'); 
const AppError = require('../utils/appError');
const Video = require('../models/videoModel');
const { publishVideoCreatedEvent, publishVideoDeletedEvent, publishVideoUpdatedEvent } = require('../rabbitmq/publisher');

const UploadVideo = catchGrpc(async (call, callback) => {
    const { title, description, genre } = call.request;
    const video = await Video.create({
        title,
        description,
        genre
    });
    publishVideoCreatedEvent(video);
    callback(null, { video });
});

const GetVideo = catchGrpc(async (call, callback) => {
    const { id } = call.request;
    const video = await Video.findById(id);
    if (!video) {
        return callback(new AppError("Video not found", 404), null);
    }
    callback(null, { video });
});

const UpdateVideo = catchGrpc(async (call, callback) => {
    const { id, title, description, genre } = call.request;
    const video = await Video.findByIdAndUpdate(id, { title, description, genre }, { new: true });
    if (!video) {
        return callback(new AppError("Video not found", 404), null);
    }
    publishVideoUpdatedEvent(video._id, { title });
    callback(null, { video });
});

const DeleteVideo = catchGrpc(async (call, callback) => {
    const { id } = call.request;
    const video = await Video.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    if (!video) {
        return callback(new AppError("Video not found", 404), null);
    }
    publishVideoDeletedEvent(video._id);
    callback(null, { video });
});

const ListVideos = catchGrpc(async (call, callback) => {
    const { page = 1, limit = 10, title, genre } = call.request;
    const query = {};
    if (title) {
        query.title = { $regex: title, $options: "i" };
    }
    if (genre) {
        query.genre = genre;
    }
    const videos = await Video.find(query)
        .skip((page - 1) * limit)
        .limit(limit);
    const total = await Video.countDocuments(query);
    callback(null, { videos, total });
});

module.exports = {
    UploadVideo,
    GetVideo,
    UpdateVideo,
    DeleteVideo,
    ListVideos
};
