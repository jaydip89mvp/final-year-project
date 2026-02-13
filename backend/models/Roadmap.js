import mongoose from 'mongoose';

const NODE_KEY_DELIM = '\x01';

const roadmapSchema = new mongoose.Schema({
  nodeKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  subjectName: { type: String, required: true, trim: true },
  path: {
    type: [String],
    default: []
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  children: [
    { name: { type: String, required: true, trim: true } }
  ],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

roadmapSchema.statics.buildNodeKey = function (subjectId, pathArray = []) {
  const id = subjectId.toString?.() || subjectId;
  if (!pathArray || pathArray.length === 0) return id;
  const safe = pathArray.map((p) => String(p).trim().replace(/\x01/g, '_'));
  return [id, ...safe].join(NODE_KEY_DELIM);
};

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;
export { NODE_KEY_DELIM };
