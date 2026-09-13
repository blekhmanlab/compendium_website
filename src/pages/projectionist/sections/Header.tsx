import HeaderWrapper from "@/components/Header";
import Title from "@/components/Title";

export default function Header() {
  return (
    <HeaderWrapper className="gap-8! py-12!">
      <div className="flex flex-wrap items-center justify-center gap-8">
        <Title className="text-xl" />

        <h2 className="font-medium">Projectionist</h2>
      </div>

      <p>Compare your data to ours and discover meaningful insights.</p>
    </HeaderWrapper>
  );
}
