import React, { type InputHTMLAttributes } from 'react';

interface CustomCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  checked,
  onChange,
  ...props
}) => {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="absolute opacity-0 w-0 h-0"
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <div className="flex items-center justify-center">
          <svg
            width="19"
            height="19"
            viewBox="0 0 19 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path
              d="M2.28125 0.75H16.7187C17.564 0.75 18.25 1.436 18.25 2.28125V16.7187C18.25 17.1249 18.0887 17.5143 17.8015 17.8015C17.5143 18.0887 17.1249 18.25 16.7187 18.25H2.28125C1.87514 18.25 1.48566 18.0887 1.19849 17.8015C0.911328 17.5143 0.75 17.1249 0.75 16.7187V2.28125C0.75 1.436 1.436 0.75 2.28125 0.75ZM2.0625 2.28125V16.7187C2.0625 16.8395 2.1605 16.9375 2.28125 16.9375H16.7187C16.7768 16.9375 16.8324 16.9145 16.8734 16.8734C16.9145 16.8324 16.9375 16.7768 16.9375 16.7187V2.28125C16.9375 2.22323 16.9145 2.16759 16.8734 2.12657C16.8324 2.08555 16.7768 2.0625 16.7187 2.0625H2.28125C2.22323 2.0625 2.16759 2.08555 2.12657 2.12657C2.08555 2.16759 2.0625 2.22323 2.0625 2.28125Z"
              fill="#50555C"
            />
          </svg>

          {checked && (
            <svg
              width="11"
              height="7"
              viewBox="0 0 11 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-1 top-2"
            >
              <path
                d="M10.12 1.12023C10.2359 0.995829 10.299 0.831289 10.296 0.661276C10.293 0.491262 10.2241 0.32905 10.1039 0.208814C9.98367 0.0885771 9.82146 0.0197035 9.65144 0.0167038C9.48143 0.0137041 9.31689 0.0768125 9.19249 0.192733L3.96874 5.41648L1.80749 3.25523C1.68308 3.13931 1.51854 3.0762 1.34853 3.0792C1.17852 3.0822 1.0163 3.15108 0.896068 3.27131C0.775832 3.39155 0.706959 3.55376 0.70396 3.72378C0.70096 3.89379 0.764068 4.05833 0.879988 4.18273L3.50499 6.80773C3.62803 6.93063 3.79483 6.99966 3.96874 6.99966C4.14264 6.99966 4.30944 6.93063 4.43249 6.80773L10.12 1.12023Z"
                fill="#50555C"
              />
            </svg>
          )}
        </div>
      </div>
      {label && <span className="ml-2 text-gray-700">{label}</span>}
    </label>
  );
};

export default CustomCheckbox;