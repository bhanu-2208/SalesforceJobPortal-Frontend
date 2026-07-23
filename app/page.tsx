import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PopularCategories from "@/components/PopularCategories";
import LatestJobs from "@/components/LatestJobs";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import FeedbackForm from "@/components/Feedbackform";
import FeaturesSection from "@/components/FeaturesSection";


export default function Home() {
  return (
    <div className="page">
      <Navbar />
      <main>
        <HeroSection />
        <PopularCategories />
        <LatestJobs />
        <FeaturesSection/>
        <Testimonials />
        <FeedbackForm />
      </main>
      <Footer />
    </div>
  );
}