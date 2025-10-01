import DocuScoutIcon from "@/components/icons/docuscout-icon";
import Link from "next/link";

const links = [
  {
    title: "Features",
    href: "#features",
  },
  {
    title: "Pricing",
    href: "#pricing",
  },
];

export default function FooterSection() {
  return (
    <footer className="py-8 md:py-16 mt-8 md:mt-16 border-t">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/" aria-label="go home" className="mx-auto block size-fit">
          <DocuScoutIcon />
        </Link>

        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="text-muted-foreground hover:text-primary block duration-150"
            >
              <span>{link.title}</span>
            </Link>
          ))}
        </div>
        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          <Link
            href="https://github.com/orykevin"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-muted-foreground hover:text-primary block"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M19.993 1C15.2746 1.00245 10.7109 2.6736 7.11804 5.71464C3.52513 8.75568 1.13726 12.9683 0.381404 17.5993C-0.374455 22.2302 0.550977 26.9775 2.99224 30.9922C5.43351 35.007 9.23141 38.0274 13.7068 39.5135C14.6942 39.6967 15.0661 39.0848 15.0661 38.5645C15.0661 38.0441 15.0463 36.5355 15.0397 34.8862C9.51058 36.0807 8.34223 32.553 8.34223 32.553C7.44044 30.2623 6.13714 29.6601 6.13714 29.6601C4.33357 28.4362 6.27209 28.4591 6.27209 28.4591C8.26983 28.5999 9.31971 30.4979 9.31971 30.4979C11.0904 33.5183 13.9701 32.6446 15.1023 32.1341C15.28 30.8546 15.7967 29.9841 16.3661 29.49C11.9493 28.9925 7.30879 27.2974 7.30879 19.725C7.28142 17.7611 8.01434 15.8619 9.35591 14.4203C9.15186 13.9229 8.47057 11.9136 9.55008 9.1844C9.55008 9.1844 11.2187 8.65427 15.0167 11.2101C18.2744 10.3242 21.7115 10.3242 24.9692 11.2101C28.7639 8.65427 30.4293 9.1844 30.4293 9.1844C31.5121 11.9071 30.8308 13.9164 30.6267 14.4203C31.9726 15.8621 32.707 17.7646 32.6771 19.7315C32.6771 27.3203 28.0267 28.9925 23.6034 29.4801C24.3143 30.0954 24.9495 31.2964 24.9495 33.142C24.9495 35.7862 24.9264 37.9132 24.9264 38.5645C24.9264 39.0913 25.2852 39.7066 26.2923 39.5135C30.7682 38.0273 34.5665 35.0063 37.0077 30.9908C39.4489 26.9754 40.3739 22.2274 39.6172 17.596C38.8604 12.9647 36.4714 8.75199 32.8773 5.71147C29.2832 2.67095 24.7185 1.0009 19.9995 1H19.993Z"
                fill="currentColor"
              />
              <path
                d="M7.64403 29.3754C7.60125 29.4736 7.44327 29.503 7.31491 29.4343C7.18656 29.3656 7.09112 29.238 7.1372 29.1365C7.18327 29.0351 7.33796 29.0089 7.46631 29.0776C7.59467 29.1463 7.6934 29.2772 7.64403 29.3754Z"
                fill="currentColor"
              />
              <path
                d="M8.45045 30.2688C8.38229 30.3029 8.30431 30.3125 8.22986 30.2957C8.15542 30.279 8.08913 30.2371 8.04234 30.1772C7.91399 30.0397 7.88764 29.8499 7.98638 29.7648C8.08511 29.6797 8.26285 29.719 8.39121 29.8565C8.51956 29.9939 8.54918 30.1837 8.45045 30.2688Z"
                fill="currentColor"
              />
              <path
                d="M9.23367 31.4043C9.1119 31.4894 8.90454 31.4043 8.78935 31.2341C8.7575 31.2036 8.73217 31.167 8.71486 31.1265C8.69756 31.0861 8.68863 31.0425 8.68863 30.9985C8.68863 30.9545 8.69756 30.911 8.71486 30.8705C8.73217 30.83 8.7575 30.7934 8.78935 30.7629C8.91112 30.6811 9.11848 30.7629 9.23367 30.9298C9.34886 31.0967 9.35215 31.3192 9.23367 31.4043Z"
                fill="currentColor"
              />
              <path
                d="M10.2968 32.5039C10.1881 32.625 9.96764 32.5922 9.78662 32.4286C9.60561 32.265 9.56281 32.0425 9.67142 31.9246C9.78003 31.8068 10.0005 31.8396 10.1881 31.9999C10.3757 32.1603 10.4119 32.3861 10.2968 32.5039Z"
                fill="currentColor"
              />
              <path
                d="M11.7876 33.1453C11.7382 33.2991 11.5144 33.3678 11.2906 33.3023C11.0668 33.2369 10.9187 33.0536 10.9615 32.8965C11.0043 32.7395 11.2314 32.6675 11.4585 32.7395C11.6856 32.8115 11.8304 32.9849 11.7876 33.1453Z"
                fill="currentColor"
              />
              <path
                d="M13.4136 33.2565C13.4136 33.4169 13.2293 33.5543 12.9923 33.5576C12.7554 33.5609 12.5612 33.43 12.5612 33.2696C12.5612 33.1093 12.7455 32.9718 12.9824 32.9686C13.2194 32.9653 13.4136 33.0929 13.4136 33.2565Z"
                fill="currentColor"
              />
              <path
                d="M14.9274 33.0046C14.957 33.1649 14.7924 33.3318 14.5555 33.3711C14.3185 33.4104 14.1111 33.3155 14.0815 33.1584C14.0519 33.0013 14.223 32.8311 14.4534 32.7886C14.6838 32.7461 14.8977 32.8442 14.9274 33.0046Z"
                fill="currentColor"
              />
            </svg>
          </Link>
          <Link
            href="https://x.com/kevinory99"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X/Twitter"
            className="text-muted-foreground hover:text-primary block"
          >
            <svg
              className="size-6"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
              ></path>
            </svg>
          </Link>
          <Link
            href="https://www.linkedin.com/in/kevinory/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-muted-foreground hover:text-primary block"
          >
            <svg
              className="size-6"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"
              ></path>
            </svg>
          </Link>
          <Link
            href="https://www.instagram.com/oryworks/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-muted-foreground hover:text-primary block"
          >
            <svg
              className="size-6"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"
              ></path>
            </svg>
          </Link>
        </div>
        <span className="text-muted-foreground block text-center text-sm">
          {" "}
          © {new Date().getFullYear()} Oryworks
        </span>
      </div>
    </footer>
  );
}
