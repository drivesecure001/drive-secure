module.exports = {
    vehicleRegistration: (fullName, renewal) => {
        const formatDate = (date) =>
            date ? new Date(date).toLocaleDateString() : "Not provided";

        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin-bottom: 10px;">✅ Vehicle Registration Submitted</h2>
                    <p style="color: #555; font-size: 15px;">Dear <strong>${fullName}</strong>, thank you for your submission!</p>
                </div>

                <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin-bottom: 25px;">
                    <h3 style="color: #3498db; margin-top: 0;">🔍 Submission Details</h3>
                    <p><strong>Reference Number:</strong> ${
                        renewal._id || "N/A"
                    }</p>
                    <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Status:</strong> <span style="color: #f39c12;">Pending Review</span></p>
                </div>

                <h3 style="color: #3498db; border-bottom: 1px solid #e1e1e1; padding-bottom: 6px;">🚘 Vehicle Information</h3>
                <ul style="list-style: none; padding: 0; font-size: 14px; color: #333; margin-top: 10px;">
                    <li><strong>Registration Number:</strong> ${
                        renewal.registrationNumber
                    }</li>
                    <li><strong>Registered Name:</strong> ${
                        renewal.registeredName
                    }</li>
                    <li><strong>Contact Number:</strong> ${
                        renewal.contactNumber
                    }</li>
                </ul>

                <h3 style="color: #3498db; border-bottom: 1px solid #e1e1e1; padding-bottom: 6px; margin-top: 25px;">📅 Document Expiry Dates</h3>
                <ul style="list-style: none; padding: 0; font-size: 14px; color: #333; margin-top: 10px;">
                    <li><strong>License Expiry:</strong> ${formatDate(
                        renewal.licenseExpiry
                    )}</li>
                    <li><strong>Road Worthiness Expiry:</strong> ${formatDate(
                        renewal.roadWorthinessExpiry
                    )}</li>
                    ${
                        renewal.hackneyPermitExpiry
                            ? `<li><strong>Hackney Permit Expiry:</strong> ${formatDate(
                                  renewal.hackneyPermitExpiry
                              )}</li>`
                            : ""
                    }
                    <li><strong>Insurance Expiry:</strong> ${formatDate(
                        renewal.insuranceExpiry
                    )}</li>
                </ul>

                ${
                    renewal.documents?.length > 0
                        ? `
                    <h3 style="color: #3498db; border-bottom: 1px solid #e1e1e1; padding-bottom: 6px; margin-top: 25px;">📎 Uploaded Documents</h3>
                    <ul style="list-style: none; padding: 0; margin-top: 10px;">
                        ${renewal.documents
                            .map(
                                (doc) => `
                                <li style="margin-bottom: 10px;">
                                    <a href="${doc.url}" 
                                       style="color: #2980b9; text-decoration: none;"
                                       target="_blank" download>
                                        ${
                                            doc.documentType === "image"
                                                ? "📷 Image"
                                                : "📄 Document"
                                        } - Download document
                                    </a>
                                </li>
                            `
                            )
                            .join("")}
                    </ul>`
                        : ""
                }

                <div style="margin-top: 30px; padding: 15px; background: #e8f4fc; border-radius: 5px;">
                    <p style="color: #333; font-size: 14px; margin: 0 0 8px 0;">We will review your submission and notify you 7 days before the expiration of your request.</p>
                    <p style="color: #333; font-size: 14px; margin: 0;">Thank you for using our vehicle registration service!</p>
                </div>

                <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
                    This is an automated message. Please do not reply directly.
                </p>
            </div>
        `;
    },

    adminNotification: (fullName, email, renewal, files) => {
        const downloadLinks = files.map((file) => {
            const forcedUrl = file.path.replace(
                "/upload/",
                "/upload/fl_attachment/"
            );
            return `<li><a href="${forcedUrl}" target="_blank">
                    ${
                        file.mimetype.includes("image")
                            ? "📷 Image"
                            : "📄 Document"
                    } - Download</a></li>`;
        });

        const formatDate = (date) =>
            date ? new Date(date).toLocaleDateString() : "Not provided";

        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; margin-bottom: 10px;">📬 New Vehicle Renewal Submission</h2>
                <p style="color: #555; font-size: 15px;">A new renewal has been submitted by <strong>${fullName}</strong>.</p>
            </div>

            <div style="background: #f2f3f5; padding: 16px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="color: #3498db; margin-top: 0;">📝 Submission Summary</h3>
                <p><strong>Reference Number:</strong> ${
                    renewal._id || "N/A"
                }</p>
                <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> <span style="color: #f39c12;">Pending Review</span></p>
            </div>

            <h3 style="color: #3498db; border-bottom: 1px solid #ddd; padding-bottom: 6px;">👤 User Information</h3>
            <ul style="list-style: none; padding: 0; font-size: 14px; color: #333; margin-top: 10px;">
                <li><strong>Full Name:</strong> ${fullName}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Phone Number:</strong> ${renewal.contactNumber}</li>
            </ul>

            <h3 style="color: #3498db; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 25px;">🚘 Vehicle Information</h3>
            <ul style="list-style: none; padding: 0; font-size: 14px; color: #333;">
                <li><strong>Registration Number:</strong> ${
                    renewal.registrationNumber
                }</li>
                <li><strong>Registered Name:</strong> ${
                    renewal.registeredName
                }</li>
            </ul>

            <h3 style="color: #3498db; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 25px;">📅 Expiry Details</h3>
            <ul style="list-style: none; padding: 0; font-size: 14px; color: #333;">
                <li><strong>License Expiry:</strong> ${formatDate(
                    renewal.licenseExpiry
                )}</li>
                <li><strong>Road Worthiness Expiry:</strong> ${formatDate(
                    renewal.roadWorthinessExpiry
                )}</li>
                ${
                    renewal.hackneyPermitExpiry
                        ? `<li><strong>Hackney Permit Expiry:</strong> ${formatDate(
                              renewal.hackneyPermitExpiry
                          )}</li>`
                        : ""
                }
                <li><strong>Insurance Expiry:</strong> ${formatDate(
                    renewal.insuranceExpiry
                )}</li>
            </ul>

            ${
                renewal.documents?.length > 0
                    ? `
                <h3 style="color: #3498db; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 25px;">📎 Uploaded Documents</h3>
                <ul style="list-style: none; padding: 0; margin-top: 10px;">
                ${downloadLinks.join("")}
                </ul>`
                    : ""
            }

            <div style="margin-top: 30px; padding: 15px; background: #eaf5e5; border-radius: 5px;">
                <p style="font-size: 14px; color: #2e7d32;">Please review and take action on this submission at your earliest convenience.</p>
            </div>

            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
                This notification was automatically generated by the system.
            </p>
            </div>
        `;
    },
};
