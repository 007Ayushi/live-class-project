import mongoose from 'mongoose';


const sessionSchema = new mongoose.Schema({
    //Index helps to quickly find the session by roomId
    //Index looks up the session by roomId, making it faster to find the session when a user tries to join using the roomId
    //Unique ensures that no two sessions can have the same roomId
    //Trim removes any leading or trailing whitespace from the roomId
    //Required ensures that a session cannot be created without a roomId
    //The roomId is a unique identifier for each session, allowing users to join the correct session when they enter the roomId
    //The roomId is generated using a combination of random characters, ensuring that it is unique and difficult to guess
    roomId:{ type: String, required: true, unquie:true,trim:true,index:true },
    host: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    hostName:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['active','ended'],
        default:'active'
    },
    participants: [{
        userId:{
               type:mongoose.Schema.Types.ObjectId,
                ref:'User',
                required:true
        },
        userName:{
                type:String,
                required:true

        },
        joinedAt:{
            type:Date,
            default:Date.now
        }
    }],
    startedAt:{
            type:Date,
            default:Date.now
    },
    endedAt:{
            type:Date,
            default:Date.now
    }
},{
    timestamps:true
});


sessionSchema.statics.generateRoomId = function() {
    const chars = 'ABCD16383JHDYBSNNH27362ANHDTB';
    let roomId = '';
    for(let i=0;i<12; i++){
        roomId+= chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return roomId;
}


sessionSchema.statics.roomIdExists = async function(roomId) {
    const session = await this.findOne({roomId});
    return !!session;
}


export default mongoose.model('Session', sessionSchema)