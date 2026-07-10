import HeaderWrapper from "@/components/Header";
import Title from "@/components/Title";

export default function Header() {
  return (
    <HeaderWrapper className="gap-8! py-12!">
      <div className="flex flex-wrap gap-8">
        <Title />

        <h2>Projectionist</h2>
      </div>

      <p>
        Compare your data to ours and discover meaningful insights. Upload your
        16S taxonomic read and classification tables and see how they're
        distributed relative to Compendium data.
      </p>
    </HeaderWrapper>
  );
}
