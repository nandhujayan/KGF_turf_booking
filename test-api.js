fetch("http://localhost:3000/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test Name",
    email: "test_second@example.com",
    phone: "1111111111",
    password: "password"
  })
}).then(res => res.text().then(text => console.log(res.status, text))).catch(console.error);
