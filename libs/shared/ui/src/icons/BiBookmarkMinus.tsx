function BiBookmarkMinus(props) {
  return (
    <svg
      className="text-gray-400 hover:text-black"
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      viewBox="0 0 24 24"
      height="1.5em"
      width="1.5em"
      {...props}
    >
      <path d="M8 9H16V11H8z" />
      <path d="M20,22V10V9.276V4c0-1.103-0.897-2-2-2H6C4.897,2,4,2.897,4,4v5.276V10v12l8-4.572L20,22z M6,10V9.276V4h12v5.276V10v8.553 l-6-3.428l-6,3.428V10z" />
    </svg>
  );
}

export default BiBookmarkMinus;