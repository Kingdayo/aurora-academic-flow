import GroupManager from "@/components/GroupManager";

export default function GroupManagerMobileDemo() {
  return (
    <div className="bg-white min-h-screen w-full max-w-sm mx-auto">
      <GroupManager
        onGroupSelect={(groupId) => console.log("Selected group:", groupId)}
      />
    </div>
  );
}
