import HeaderWrapper from "@/components/Header";
import Title from "@/components/Title";

export default function Header() {
  return (
    <HeaderWrapper className="gap-8! py-12!">
      <div className="flex flex-wrap gap-8">
        <Title />

        <h2 className="w-fit p-0 font-light">Projectionist</h2>
      </div>

      <p className="max-w-2xl">
        Compare your data to our Compendium. Lorem ipsum dolor sit amet,
        consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
        et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>
    </HeaderWrapper>
  );
}
