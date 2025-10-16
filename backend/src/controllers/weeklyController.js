import { getWeeklyGrid } from "../utils/weekly.js";

export async function getWeekly(req,res){
  const start = req.query.start; // YYYY-MM-DD Pazartesi
  if (!start) return res.status(400).json({error:"start required"});
  const data = await getWeeklyGrid(start);
  res.json(data);
}
