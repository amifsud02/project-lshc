'use client'

import { useState } from "react"
import './contact.css'

export default function ContactForm() {

    const [values, setValues] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
    })

    const [message, setMessage] = useState('');
    const [isSuccess, setSuccess] = useState(true);

    const [contact, setContact] = useState("General");

    // const { firstName, lastName, email, phone, message } = values

    const handleInputChange = (e:  React.ChangeEvent<HTMLInputElement>| React.ChangeEvent<HTMLTextAreaElement>) =>
        setValues({ ...values, [e.target.name]: e.target.value });


    const handleRadioChange = (e:  React.ChangeEvent<HTMLInputElement> ) => {
        console.log(e.target);
        setContact(e.target.value);
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        handleApiRequest(formData);
    }

    const handleApiRequest = async (formData: FormData) => {
        const response = await fetch('api/contact-form', {
            method: "POST",
            body: formData
        })

        const data = await response.json();

        if(data.status === 200) {
            setValues({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                message: "",
            })

            setSuccess(true);
            setMessage(data.message);
        } else {
            setSuccess(false);
            setMessage(data.message);
        }
    }
   
    return (
        <form className="form-group" onSubmit={handleSubmit}>
            <div className="form-input one c-small">
                <label>First Name</label>
                <input
                    type="text"
                    id="name"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                />
            </div>

            <div className="form-input two c-small">
                <label>Last Name</label>
                <input
                    type="text"
                    id="fname"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                />
            </div>

            <div className="form-input three c-small">
                <label>Email</label>
                <input
                    type="text"
                    id="email"
                    name="email"
                    value={values.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                />
            </div>

            <div className="form-input four c-small">
                <label>Phone Number</label>
                <input
                    type="text"
                    id="fname"
                    name="phone"
                    value={values.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                />
            </div>

            <div className="form-input five c-wide">
                <label>Message</label>
                <textarea
                    id="message"
                    name="message"
                    value={values.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message"
                >
                </textarea>
            </div>

            <div className="contact-selection six c-wide">
                <label>Enquiry Type</label>
                <div className="radio-buttons">
                    <div className="radio-button">
                        <input
                            type="radio"
                            id="general"
                            name="contact"
                            value="General"
                            checked={contact === "General"}
                            onChange={handleRadioChange}
                        />
                        <label htmlFor="general">General</label>
                    </div>
                    <div className="radio-button">
                        <input
                            type="radio"
                            id="nursery"
                            name="contact"
                            value="Nursery"
                            checked={contact === "Nursery"}
                            onChange={handleRadioChange}
                        />
                        <label htmlFor="nursery">Nursery</label>
                    </div>
                </div>
            </div>

            <div className="form-input seven c-wide ">
                <button className="primary-button form-submit">Send</button>
            </div>

            {message && 
                <div className="c-wide" style={{ fontWeight: '800', marginTop: '1.5rem' }}>
                    <p style={{color: `${isSuccess ? 'green' : 'red'}`}}>{message}</p> 
                </div>
            }

        </form>
    )
}