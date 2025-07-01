
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import LoadingScreen from "@/components/LoadingScreen";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }, [user, navigate]);

  return <LoadingScreen />;
};

export default Index;
