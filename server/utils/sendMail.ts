import nodemailer,{Transporter}  from "nodemailer"
import ejs from "ejs"
import path from "path";
require('dotenv').config();
interface EmailOptions{
    email:string,
    subject:string,
    template:string,
    data:{[key:string]:any}
}

export const sendMail = async(options: EmailOptions):Promise <void> =>{
    const transporter:Transporter = nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port:parseInt(process.env.SMTP_PORT || '587'),
        service:process.env.SMTP_SERVICE,
        auth:{
            user:process.env.SMTP_EMAIL,
            pass:process.env.SMPT_PASSWORD,
        }
    })
    const { email,subject,template,data} = options;

    const templatePath = path.join(__dirname, '../mails', `${template}.ejs`);

    const html:string = await ejs.renderFile(templatePath,data)

    const emailOptions = {
        from:process.env.SMTP_EMAIL,
        to:email,
        subject,
        html
    }
    await transporter.sendMail(emailOptions)
   
}