import { NextResponse, NextRequest } from "next/server";
import sendGrid from '@sendgrid/mail';

sendGrid.setApiKey(process.env.SENDGRID_API_KEY as string);

const sendEmail = async (msg: any) => {
    return new Promise((resolve, reject) => {
        sendGrid.send(msg).then(() => {
            resolve("Email sent");
        }).catch((error) => {
            reject(error);
        });
    });
};

export async function POST(request: NextRequest) {
    
    const data = await request.formData();

    const firstName = data.get('firstName');
    const lastName = data.get('lastName');
    const email = data.get('email');
    const phone = data.get('phone');
    const message = data.get('message');
    const enquireType = data.get('contact');
    
    if (!firstName || !lastName || !email || !message  || !phone) {
        return new Response(
            JSON.stringify({
                message: "Missing required fields",
                status: 400 
            }),
        );
    }

    let toEmail = 'info@lasallehandball.com';
    if(enquireType === 'Nursery') {
        toEmail = 'nursery@lasallehandball.com';
    }

    const msg = {
        from: 'mailer@lasallehandball.com',
        to: toEmail,
                
        replyTo: {
            email: email,
            name: firstName
        },

        subject: `You've received a new message from ${firstName} ${lastName}`,
        
        text: `
        
        Dear La salle Handball,
        
        You've received a new message via the contact form on your website.
        
        Here are the details:

        Name: ${firstName} ${lastName}
        Email: ${email}
        Phone: ${phone}

        Message: 
        
        ${message}

        --

        Please response at your earliest convenience.

        Best Regards,
        La Salle Handball Mailing System
        `
    }

    const emailSent = await sendEmail(msg);

    if (emailSent === "Email sent") {
        return new NextResponse(
            JSON.stringify({
                message: "Your message has been sent successfully. We'll get back to you soon!",
                status: 200
            }),
        );
    } else {
        return new NextResponse(
            JSON.stringify({
                message: "Something went wrong while processing your request.",
                status: 400 
            }),
        );
    }
}