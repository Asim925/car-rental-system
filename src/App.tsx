function App() {
  async function getUser() {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/users/1",
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log(data);
  }

  getUser();

  return (
    <div className="App">
      <h1 className="text-2xl font-bold">Hello, World!</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={getUser}
      >
        Get User
      </button>
    </div>
  );
}

export default App;
