import axios from "axios";
import { EmailAdapter, SendEmailOptions } from "payload";

const brevoAdaptor = (): EmailAdapter => {
    const adapter = () => ({
        name: "brevo",
        defaultFromAddress: "_noreply@lasallehandball.com",
        defaultFromName: "La Salle Handball",
        sendEmail: async (message: SendEmailOptions): Promise<unknown> => {
            try {
                const response = await axios("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "api-key": process.env.BREVO_API_KEY as string,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    data: {
                        sender: {
                            name: "La Salle Handball",
                            email: "_noreply@lasallehandball.com"
                        },
                        to: [{
                            email: message.to,
                            name: "Recipient"
                        }],
                        subject: message.subject,
                        htmlContent: message.html
                    }
                });

                return response.data;
            } catch (e) {
                console.error("[BREVO MAIL ADAPTER]", e)
            }
        }
    })

    return adapter;
}

export default brevoAdaptor;