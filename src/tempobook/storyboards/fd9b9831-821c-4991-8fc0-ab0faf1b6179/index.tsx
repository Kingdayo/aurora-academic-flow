import GroupManager from "@/components/GroupManager";

export default function GroupManagerStoryboard() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <GroupManager
        onGroupSelect={(groupId) => console.log("Selected group:", groupId)}
      />
    </div>
  );
}
