import React from "react";

export default function WikiLink({ text, url, extraClass = "" }) {
  if (!text) return null;
  if (!url) return <span>{text}</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`wiki-link ${extraClass}`}
      title={`View Wikipedia for ${text}`}
    >
      {text}{" "}
      <i className="fa-solid fa-arrow-up-right-from-square wiki-icon"></i>
    </a>
  );
}
