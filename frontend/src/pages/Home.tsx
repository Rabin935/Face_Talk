import React, { useEffect, useState } from "react";
import axios from "axios";

interface Item {
  id: number;
  name: string;
}

const Home: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/items") // Replace with your backend route
      .then((res) => setItems(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Items from Backend</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="p-3 bg-white rounded shadow">
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
