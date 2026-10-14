import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ToolBar } from "../../../utils/general";

export const Notepad = () => {
  const wnapp = useSelector((state) => state.apps.notepad);

  return (
    <div
      className="notepad floatTab dpShad"
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{
        ...(wnapp.size == "cstm" ? wnapp.dim : null),
        zIndex: wnapp.z,
      }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar
        app={wnapp.action}
        icon={wnapp.icon}
        size={wnapp.size}
        name="Untitled - Notepad"
      />
      <div className="windowScreen flex flex-col" data-dock="true">
        <div className="flex text-xs py-2 topBar">
          <div className="mx-2">File</div>
          <div className="mx-4">Edit</div>
          <div className="mx-4">View</div>
        </div>
        <div className="restWindow h-full flex-grow">
          <div className="w-full h-full overflow-hidden">
            <textarea className="noteText win11Scroll" id="textpad" defaultValue={`PUFF DESKTOP\n${"-".repeat(50)}\nA personal desktop in your browser.\n\nYOUR SPACE\n----------\nA familiar desktop layout with built-in apps, movable windows, and\npersonal settings. Open what you need and make the space your own.\n\nBUILT-IN APPS\n-------------\nSettings · File Explorer · Store · Terminal · Notepad\n\nABOUT PUFF\n----------\nPuff brings the familiar desktop experience to your browser.\nYour files, apps, and settings live together in one personal space.\n`} />
          </div>
        </div>
      </div>
    </div>
  );
};
