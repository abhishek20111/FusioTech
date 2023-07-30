const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types


const sample = new mongoose.Schema({
  title: String,
  createBy: String,
  courseUrl: [String],
  description: String,
  syllabus: [String],
  extraDescription: String,
  enrollID: [String]

}, { timestamps: true });
module.exports = mongoose.model("FusioTech_Course", sample); 