import instance from "./instance";

export const getMainFeaturedVote = async () => {
  const response = await instance.get("/main");
  return response.data.featuredVote;
};
