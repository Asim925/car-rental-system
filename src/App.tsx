import { useEffect, useState } from "react";
import "./App.css";

type Geo = {
  lat: string;
  lng: string;
};

type Address = {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: Geo;
};

type Company = {
  name: string;
  catchPhrase: string;
  bs: string;
};

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  address: Address;
  phone: string;
  website: string;
  company: Company;
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getUsers() {
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/users",
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data: User[] = await response.json();
        setUsers(data);
        setSelectedUser(data[0] ?? null);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getUsers();
  }, []);

  return (
    <div className="app-shell">
      <header className="page-header">
        <h1>Users</h1>
      </header>

      {isLoading ? (
        <p className="loading-text">Loading users...</p>
      ) : (
        <div className="content-grid">
          <div className="table-panel">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={selectedUser?.id === user.id ? "selected" : ""}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="details-panel">
            {selectedUser ? (
              <>
                <h2>{selectedUser.name}</h2>
                <div className="details-grid">
                  <div>
                    <p className="label">Username</p>
                    <p>{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="label">Email</p>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="label">Phone</p>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="label">Website</p>
                    <p>{selectedUser.website}</p>
                  </div>
                  <div>
                    <p className="label">Street</p>
                    <p>{selectedUser.address.street}</p>
                  </div>
                  <div>
                    <p className="label">Suite</p>
                    <p>{selectedUser.address.suite}</p>
                  </div>
                  <div>
                    <p className="label">City</p>
                    <p>{selectedUser.address.city}</p>
                  </div>
                  <div>
                    <p className="label">Zipcode</p>
                    <p>{selectedUser.address.zipcode}</p>
                  </div>
                  <div>
                    <p className="label">Latitude</p>
                    <p>{selectedUser.address.geo.lat}</p>
                  </div>
                  <div>
                    <p className="label">Longitude</p>
                    <p>{selectedUser.address.geo.lng}</p>
                  </div>
                  <div>
                    <p className="label">Company</p>
                    <p>{selectedUser.company.name}</p>
                  </div>
                  <div>
                    <p className="label">Catch Phrase</p>
                    <p>{selectedUser.company.catchPhrase}</p>
                  </div>
                  <div>
                    <p className="label">Business</p>
                    <p>{selectedUser.company.bs}</p>
                  </div>
                </div>
              </>
            ) : (
              <p>Select a user to view their details.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
