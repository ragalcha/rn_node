import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';



cloudinary.config({ 
    cloud_name: 'dtptlumxk', 
    api_key: '381283837129843', 
    api_secret: 'UAn1rxlF3oFafKVw5p4WcQjMgT0' 
  });

const uploadCloudinar = async (file) => {
    try {
        if(!file) return null
        //upload the file on cloudinary
        const res = await cloudinary.uploader.upload(file, {
           resource_type: "auto"
        });
        console.log("file upload on cloudinary successful - ", res.secure_url)
        return res
    } catch (error) {
        fs.unlinkSync(file)//remove file on temp folder on the server 
        return null
    }
}

export {uploadCloudinar}