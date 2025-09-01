export default [
  {
    path: "/",
    file: "./root.tsx",
    children: [
      {
        index: true,
        file: "./routes/home.tsx",
      },
    ],
  },
];
