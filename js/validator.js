async function validateDocument(text, expectedType) {
  const token = localStorage.getItem("mockhireToken");
  if (!text || text.trim().length < 100) {
    return { valid: false, error: "⚠️ The uploaded file appears to be empty or too short." };
  }
  const injectionPatterns = [
    /ignore (all |previous |above |prior )?instructions/i,
    /disregard (all |previous |above |prior )?instructions/i,
    /forget (all |previous |above |your )?instructions/i,
    /jailbreak/i,
    /system prompt/i,
    /override (all |previous )?instructions/i,
    /bypass (the |all )?rules/i,
  ];
  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: "⚠️ Invalid document content detected. Please upload a real document." };
    }
  }
  try {
    const res = await fetch("https://mockhire-backend.onrender.com/api/ai/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ text, expectedType })
    });

    const data = await res.json();

    if (data.valid) {
      return { valid: true };
    } else {
      return { valid: false, error: `⚠️ ${data.reason}` };
    }

  } catch (err) {
    console.error("Validation error:", err);
    return { valid: true };
  }
}