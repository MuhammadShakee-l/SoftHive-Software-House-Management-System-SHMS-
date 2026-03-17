const projectRequestApprovedEmail = ({ name, requestId, title }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 10px 0">Project Request Approved</h2>
      <p style="color:#374151">Hi ${name || 'Client'},</p>
      <p style="color:#374151">
        Your project request <b>${requestId}</b> has been approved.
      </p>
      <div style="background:#f3f4f6;border-radius:12px;padding:14px 16px;margin:14px 0">
        <p style="margin:0;color:#111827"><b>Project:</b> ${title}</p>
      </div>
      <p style="color:#374151;margin-top:14px">
        Please login to your dashboard to track project progress.
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:22px">SoftHive</p>
    </div>
  `;
};

const projectRequestRejectedEmail = ({ name, requestId, title, reason, remarks }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 10px 0">Project Request Rejected</h2>
      <p style="color:#374151">Hi ${name || 'Client'},</p>
      <p style="color:#374151">
        Your project request <b>${requestId}</b> could not be approved at this moment.
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:14px 0">
        <p style="margin:0 0 6px 0;color:#9a3412"><b>Project:</b> ${title}</p>
        <p style="margin:0;color:#9a3412"><b>Reason:</b> ${reason || 'Not specified'}</p>
        ${remarks ? `<p style="margin:8px 0 0 0;color:#9a3412"><b>Remarks:</b> ${remarks}</p>` : ''}
      </div>
      <p style="color:#374151;margin-top:14px">
        You can revise your requirements and submit a new request.
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:22px">SoftHive</p>
    </div>
  `;
};

const projectReadyForClientEmail = ({ name, projectName }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 10px 0">Your Project Is Ready for Review</h2>
      <p style="color:#374151">Hi ${name || 'Client'},</p>
      <p style="color:#374151">
        Your project <b>${projectName}</b> is ready. Please login to review the delivery and either accept or request revisions.
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:22px">SoftHive</p>
    </div>
  `;
};

const clientAcceptedProjectEmail = ({ name, projectName }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 10px 0">Project Accepted</h2>
      <p style="color:#374151">Hi ${name || 'Team'},</p>
      <p style="color:#374151">
        The client has accepted the project <b>${projectName}</b>.
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:22px">SoftHive</p>
    </div>
  `;
};

const clientRejectedProjectEmail = ({ name, projectName, remarks }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 10px 0">Client Requested Revisions</h2>
      <p style="color:#374151">Hi ${name || 'Team'},</p>
      <p style="color:#374151">
        The client rejected the delivery for <b>${projectName}</b>.
      </p>
      ${remarks ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:14px 0">
        <p style="margin:0;color:#9a3412"><b>Client Remarks:</b> ${remarks}</p>
      </div>` : ''}
      <p style="color:#6b7280;font-size:12px;margin-top:22px">SoftHive</p>
    </div>
  `;
};

const managerRejectedDeveloperEmail = ({ name, projectName, reason, remarks }) => {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 10px 0">Changes Requested by Manager</h2>
      <p style="color:#374151">Hi ${name || 'Developer'},</p>
      <p style="color:#374151">
        Manager rejected the submission for <b>${projectName}</b>.
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;margin:14px 0">
        <p style="margin:0;color:#9a3412"><b>Reason:</b> ${reason || 'Not specified'}</p>
        ${remarks ? `<p style="margin:8px 0 0 0;color:#9a3412"><b>Remarks:</b> ${remarks}</p>` : ''}
      </div>
      <p style="color:#6b7280;font-size:12px;margin-top:22px">SoftHive</p>
    </div>
  `;
};

module.exports = {
  projectRequestApprovedEmail,
  projectRequestRejectedEmail,
  projectReadyForClientEmail,
  clientAcceptedProjectEmail,
  clientRejectedProjectEmail,
  managerRejectedDeveloperEmail,
};