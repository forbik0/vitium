const contactForm = document.getElementById('contact-form');
const statusMessage = document.getElementById('form-status');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]').value;

  const btn = document.getElementById('submit-btn');
  const originalBtnText = btn.innerText;
  btn.innerText = "Odesílám...";
  btn.disabled = true;

  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value,
    template_token: turnstileResponse
  };

  try {
    const workerUrl = 'https://post-api.vitium.art';

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      statusMessage.textContent = "Zpráva byla úspěšně odeslána!";
      statusMessage.style.color = "green";
      contactForm.reset();
    } else {
      throw new Error("Chyba při odesílání.");
    }
  } catch (error) {
    statusMessage.textContent = "Chyba: " + error.message;
    statusMessage.style.color = "red";
  } finally {
    btn.innerText = originalBtnText;
    btn.disabled = false;
  }
});
