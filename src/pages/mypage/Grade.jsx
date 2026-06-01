import "./Grade.css";
import { useAuth } from "../../contexts/AuthContext";
import { getImageUrl } from "../../utils/image";

const Grade = () => {
  const { user: currentUser } = useAuth();

  const renderProfileImage = () => {
    if (currentUser?.profile_image) {
      return (
        <img
          src={getImageUrl(currentUser.profile_image)}
          alt="Profile"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      );
    }
    return <div className="gradeIconPlaceholder"></div>;
  };

  return (
    <section className="gradeSection">
      <div className="gradeCard">
        <div className="gradeHeader">
          <h3 className="gradeTitle">회원 등급 안내</h3>
        </div>
        <div className="gradeTabs">
          <div className="gradeTab active">전체 등급</div>
        </div>
        <div className="gradeContent">
          <div className="gradeItem">
            <div className="gradeIconWrapper profile-border-bronze">
              <div className="gradeIconPlaceholder">{renderProfileImage()}</div>
            </div>
            <span className="gradeName grade-bronze">BRONZE</span>
            <div className="gradeRequirements">
              <span className="gradeRequirement">투표 참여</span>
              <span className="gradeRequirement">10회 이상</span>
            </div>
          </div>
          <div className="gradeItem">
            <div className="gradeIconWrapper profile-border-silver">
              <div className="gradeIconPlaceholder">{renderProfileImage()}</div>
            </div>
            <span className="gradeName grade-silver">SILVER</span>
            <div className="gradeRequirements">
              <span className="gradeRequirement">참여 100 / 생성 10</span>
              <span className="gradeRequirement">이상 달성</span>
            </div>
          </div>
          <div className="gradeItem">
            <div className="gradeIconWrapper profile-border-gold">
              <div className="gradeIconPlaceholder">{renderProfileImage()}</div>
            </div>
            <span className="gradeName grade-gold">GOLD</span>
            <div className="gradeRequirements">
              <span className="gradeRequirement">우승 100 / 생성 100</span>
              <span className="gradeRequirement">이상 달성</span>
            </div>
          </div>
          <div className="gradeItem">
            <div className="gradeIconWrapper profile-border-platinum">
              <div className="gradeIconPlaceholder">{renderProfileImage()}</div>
            </div>
            <span className="gradeName grade-platinum">PLATINUM</span>
            <div className="gradeRequirements">
              <span className="gradeRequirement">우승 500 / 생성 200</span>
              <span className="gradeRequirement">이상 달성</span>
            </div>
          </div>
          <div className="gradeItem">
            <div className="gradeIconWrapper profile-border-diamond">
              <div className="gradeIconPlaceholder">{renderProfileImage()}</div>
            </div>
            <span className="gradeName grade-diamond">DIAMOND</span>
            <div className="gradeRequirements">
              <span className="gradeRequirement">우승 1000 / 생성 500</span>
              <span className="gradeRequirement">이상 달성</span>
            </div>
          </div>
          <div className="gradeItem">
            <div className="gradeIconWrapper profile-border-master">
              <div className="gradeIconPlaceholder">{renderProfileImage()}</div>
            </div>
            <span className="gradeName grade-master">MASTER</span>
            <div className="gradeRequirements">
              <span className="gradeRequirement">월간 랭킹 1,2,3위</span>
              <span className="gradeRequirement">3회 이상 달성</span>
            </div>
          </div>
          <div className="gradeItem">
            <div className="gradeIconWrapper profile-border-challenger">
              <div className="gradeIconPlaceholder">{renderProfileImage()}</div>
            </div>
            <span className="gradeName challenger-shine grade-challenger">CHALLENGER</span>
            <div className="gradeRequirements">
              <span className="gradeRequirement">마스터 달성 후</span>
              <span className="gradeRequirement">랭킹 1위 3회 이상</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Grade;
