import mongoose, {Schema} from "mongoose";
import mongooseAgregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
    videoFile:{
        type: String,
        require: true
    },
    title:{
        type: String,
        require: true
    },
    description:{
        type: String,
        require: true
    },
    duration:{
        type: Number,//coludnary 
        require: true
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
        require: true
    }
},
{
    timestamps: true
}
)

videoSchema.plugin(mongooseAgregatePaginate)
export const Video = mongoose.model("Video", videoSchema)